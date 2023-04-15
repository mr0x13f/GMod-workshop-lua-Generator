# GMod workshop.lua Generator
Node.js script for generating a workshop.lua file for a GMod Server based on a Steam Workshop collection.

Requires Node.js.

Usage:
```sh
node gmod-workshop-lua-generator.js <COLLECTION_ID> <WORKSHOP_LUA_PATH>
```

You can add this to your server startup script so it runs every time. Example:
```cmd
node gmod-workshop-lua-generator.js 2234431946 garrysmod/lua/autorun/server/workshop.lua
start srcds.exe +host_workshop_collection 2234431946
```
