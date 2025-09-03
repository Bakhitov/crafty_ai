/**
 * Frontend Integration: WhatsApp Web (Baileys) — Instance lifecycle
 *
 * Headers
 * - Always send: apikey
 * - Before instance creation: use the global API key
 * - After creation: use the returned "hash" as apikey for that instance
 *
 * 1) Create instance (returns token/hash)
 *   POST /instance/create
 *   Body (minimal):
 *   {
 *     "instanceName": "my-instance",
 *     "integration": "WHATSAPP-BAILEYS",
 *     "qrcode": true
 *   }
 *   Response contains:
 *   - hash: token to use as apikey for all subsequent calls of this instance
 *   - instance: { instanceName, instanceId, integration, status }
 *   - qrcode: may be present immediately (base64 and/or pairingCode)
 *
 * 2) Get QR (if not returned in step 1 or to refresh while connecting)
 *   GET /instance/connect/:instanceName
 *   Headers: apikey: <hash>
 *   Response: { qrcode: { base64, pairingCode, code, count } }
 *   - Show base64 image OR display pairingCode in the UI for the user
 *
 * 3) Check connection state
 *   GET /instance/connectionState/:instanceName
 *   Headers: apikey: <hash>
 *   Response: { instance: { instanceName, state: "open" | "connecting" | "close" } }
 *   - Proceed once state === "open"
 *
 * 4) Optional settings
 *   - Set:  POST /settings/set/:instanceName (Headers: apikey)
 *   - Get:  GET  /settings/find/:instanceName (Headers: apikey)
 *
 * 5) Optional proxy
 *   - Set:  POST /proxy/set/:instanceName (Headers: apikey)
 *   - Get:  GET  /proxy/find/:instanceName (Headers: apikey)
 *
 * 6) Basic Baileys checks
 *   - Check if number is on WhatsApp:
 *     POST /baileys/onWhatsapp/:instanceName (Headers: apikey)
 *     Body: { "number": "5511999999999" }
 *   - Fetch profile picture URL:
 *     POST /baileys/profilePictureUrl/:instanceName (Headers: apikey)
 *     Body: { "number": "5511999999999" }
 *
 * 7) Send test message
 *   - Text:  POST /message/sendText/:instanceName (Headers: apikey)
 *            { "number": "<E164>", "text": "Hello from Evolution API!" }
 *   - Media: POST /message/sendMedia/:instanceName (multipart/form-data file="file")
 *            or provide media as URL/base64 in body
 *   - More:  /message/sendButtons, /message/sendList, /message/sendReaction, etc.
 *
 * 8) Restart / reconnect (if needed)
 *   - Restart: POST /instance/restart/:instanceName (Headers: apikey)
 *   - Reconnect & QR: GET /instance/connect/:instanceName (Headers: apikey)
 *
 * 9) Logout and delete
 *   - Logout: DELETE /instance/logout/:instanceName (Headers: apikey)
 *   - Delete: DELETE /instance/delete/:instanceName (Headers: apikey)
 */
/**
 * Request/Response examples (separate frontend/backend servers)
 * Base URL example: https://api.example.com
 *
 * 1) Create instance
 *   Request:
 *   POST https://api.example.com/instance/create
 *   Headers:
 *     apikey: <GLOBAL_API_KEY>
 *     Content-Type: application/json
 *   Body:
 *   {
 *     "instanceName": "my-instance",
 *     "integration": "WHATSAPP-BAILEYS",
 *     "qrcode": true
 *   }
 *   Response 201:
 *   {
 *     "instance": {
 *       "instanceName": "my-instance",
 *       "instanceId": "c0a8017a-...",
 *       "integration": "WHATSAPP-BAILEYS",
 *       "status": "connecting"
 *     },
 *     "hash": "1F8F5D2A-...", // use as apikey for this instance
 *     "qrcode": {
 *       "pairingCode": "1234-5678",
 *       "base64": "data:image/png;base64,iVBORw0...",
 *       "code": "<raw-qr-string>",
 *       "count": 1
 *     }
 *   }
 *
 * 2) Get QR (refresh while connecting)
 *   Request:
 *   GET https://api.example.com/instance/connect/my-instance
 *   Headers:
 *     apikey: <hash>
 *   Response 200:
 *   {
 *     "instance": { "instanceName": "my-instance", "status": "connecting" },
 *     "qrcode": {
 *       "pairingCode": "1234-5678",
 *       "base64": "data:image/png;base64,iVBORw0...",
 *       "code": "<raw-qr-string>",
 *       "count": 2
 *     }
 *   }
 *
 * 3) Check connection state
 *   Request:
 *   GET https://api.example.com/instance/connectionState/my-instance
 *   Headers:
 *     apikey: <hash>
 *   Response 200:
 *   { "instance": { "instanceName": "my-instance", "state": "open" } }
 *
 * 4) Send text message
 *   Request:
 *   POST https://api.example.com/message/sendText/my-instance
 *   Headers:
 *     apikey: <hash>
 *     Content-Type: application/json
 *   Body:
 *   { "number": "5511999999999", "text": "Hello from Evolution API!" }
 *   Response 201 (example shape):
 *   {
 *     "key": { "fromMe": true, "id": "b8f...", "remoteJid": "5511999999999@s.whatsapp.net" },
 *     "messageType": "conversation",
 *     "message": { "conversation": "Hello from Evolution API!" },
 *     "messageTimestamp": 1725200000,
 *     "instanceId": "c0a8017a-..."
 *   }
 *
 * 5) Check if number is on WhatsApp (Baileys)
 *   Request:
 *   POST https://api.example.com/baileys/onWhatsapp/my-instance
 *   Headers:
 *     apikey: <hash>
 *     Content-Type: application/json
 *   Body:
 *   { "jid": "5511999999999@s.whatsapp.net" }
 *   Response 200 (from Baileys):
 *   [ { "jid": "5511999999999@s.whatsapp.net", "exists": true } ]
 *
 * 6) Profile picture URL (Baileys)
 *   Request:
 *   POST https://api.example.com/baileys/profilePictureUrl/my-instance
 *   Headers:
 *     apikey: <hash>
 *     Content-Type: application/json
 *   Body:
 *   { "jid": "5511999999999@s.whatsapp.net", "type": "image", "timeoutMs": 10000 }
 *   Response 200:
 *   "https://mmg.whatsapp.net/....jpg"
 *
 * 7) Settings — set/find
 *   Set:
 *   POST https://api.example.com/settings/set/my-instance
 *   Headers: apikey, Content-Type: application/json
 *   Body:
 *   {
 *     "rejectCall": false,
 *     "groupsIgnore": false,
 *     "alwaysOnline": false,
 *     "readMessages": true,
 *     "readStatus": true,
 *     "syncFullHistory": false,
 *     "wavoipToken": ""
 *   }
 *   Response 201: { ...persisted settings... }
 *
 *   Find:
 *   GET https://api.example.com/settings/find/my-instance
 *   Headers: apikey
 *   Response 200: { ...settings... }
 *
 * 8) Proxy — set/find
 *   Set:
 *   POST https://api.example.com/proxy/set/my-instance
 *   Headers: apikey, Content-Type: application/json
 *   Body:
 *   {
 *     "enabled": true,
 *     "host": "127.0.0.1",
 *     "port": "8080",
 *     "protocol": "http",
 *     "username": "",
 *     "password": ""
 *   }
 *   Response 201: { ...persisted proxy... }
 *
 *   Find:
 *   GET https://api.example.com/proxy/find/my-instance
 *   Headers: apikey
 *   Response 200: { ...proxy... }
 *
 * 9) Restart / reconnect
 *   Restart:
 *   POST https://api.example.com/instance/restart/my-instance
 *   Headers: apikey
 *   Response 200: same shape as connect (may include qrcode if reconnecting)
 *
 * 10) Logout / delete
 *   Logout:
 *   DELETE https://api.example.com/instance/logout/my-instance
 *   Headers: apikey
 *   Response 200: { "status": "SUCCESS", "error": false, "response": { "message": "Instance logged out" } }
 *
 *   Delete:
 *   DELETE https://api.example.com/instance/delete/my-instance
 *   Headers: apikey
 *   Response 200: { "status": "SUCCESS", "error": false, "response": { "message": "Instance deleted" } }
 */
