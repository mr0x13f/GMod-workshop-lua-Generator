const fs = require('fs');
const https = require('https');

// Formats current local time as "dd/MM/yyyy at HH:mm"
function now() {
    let date = new Date();
    let dateString = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    let timeString = `${date.getHours()}:${date.getMinutes() < 10 ? '0' : '' }${date.getMinutes()}`;
    return `${dateString} at ${timeString}`;
}

async function httpGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, response => {
            let data = [];

            response.on('data', chunk => {
                data.push(chunk);
            });

            response.on('end', () => {
                if (response.statusCode == 200)
                    resolve(Buffer.concat(data).toString());
                else
                    reject(err);
            })
        }).on('error', err => {
            reject(err);
        });
    });
}

// Removes text from a string until a certain search string is found, and the text that was removed
function consumeUntil(text, search) {
    let startIndex = text.indexOf(search);
    let endIndex = startIndex + search.length;
    let resultingText = text.substring(endIndex);
    let consumedText = text.substring(0, startIndex);
    return [resultingText, consumedText];
}

// Generate lua code for a collection
async function readCollection(collectionId) {
    let html = await httpGet(`https://steamcommunity.com/workshop/filedetails/?id=${collectionId}`);
    let lua = '';

    [html, _] = consumeUntil(html, '<div class="workshopItemTitle">');
    [html, collectionName] = consumeUntil(html, '</div>');
    [html, _] = consumeUntil(html, '<span class="childCount">(');
    [html, itemsCount] = consumeUntil(html, ')</span>');

    lua += '\n----------------------------------------------------------------------';
    lua += `\n-- ${collectionName}`;
    lua += `\n-- # of items: ${itemsCount}`;
    lua += `\n-- https://steamcommunity.com/workshop/filedetails/?id=${collectionId}`;
    lua += '\n----------------------------------------------------------------------';
    lua += '\n';

    // Collection items
    while(html.indexOf('<div class="collectionItemDetails">') > -1) {
        [html, _] = consumeUntil(html, '<div class="collectionItemDetails">');
        [html, _] = consumeUntil(html, 'href="https://steamcommunity.com/sharedfiles/filedetails/?id=');
        [html, fileId] = consumeUntil(html, '"');
        [html, _] = consumeUntil(html, '<div class="workshopItemTitle">');
        [html, fileName] = consumeUntil(html, '</div>');

        lua += `\nresource.AddWorkshop("${fileId}") -- ${fileName}`;
    }

    lua += '\n\n\n';

    // Child collections
    [html, _] = consumeUntil(html, 'class="collectionChildren">');

    while(html.indexOf('class="workshopItem">') > -1) {
        [html, _] = consumeUntil(html, 'class="workshopItem">');
        [html, _] = consumeUntil(html, 'href="https://steamcommunity.com/sharedfiles/filedetails/?id=');
        [html, childId] = consumeUntil(html, '"');

        // Recursively read the child collection
        lua += await readCollection(childId);
    }

    return lua;
}

async function main() {
    let collectionId = process.argv[2];
    let workshopFilePath = process.argv[3];

    let lua = `-- Generated on ${now()}`;
    lua += '\n';
    lua += await readCollection(collectionId);

    fs.writeFileSync(workshopFilePath, lua, {flag: 'w', encoding: 'utf8'});
}

main();
