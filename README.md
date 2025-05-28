# TradeGPT Bot

An automated bot for interact with TradeGPT [0GLABS]
---

## Prerequisites

- Node.js minimal version 16.x or more
- NPM (Node Package Manager)
- Internet Connection


---

## Setup Project

1. **Clone repository**

```bash
git clone https://github.com/dickifatma/TradeGPT-BOT.git
cd TradeGPT-BOT
```
2. **Install dependencies**
```bash
npm install 
```
3. **Create ```.env``` file and save your privkey or mnemonic phrase with format**
```bash
PRIVATE_KEY_1=0XADDRESS
PRIVATE_KEY_2=0XADDRESS
MNEMONIC_PHRASE="your phrase wallet"
```
4. **Edit ```randomPrompt.json``` with your prompt, example:**
```json
[
    "Swap 10 USDT to NEIZ",
    "Swap 200 USDT to NEIZ",
    etc...
]
```
5. **Run bot**
```bash
node main.js
```

---
## Project Structure
* ```main.js``` — Main bot code

* ```.env``` — Environment file for private keys and mnemonics

* ```randomPrompt.json``` — JSON file containing random chat prompts


---

**MADE WITH ❤️‍🔥 and 🤖**

**Credits: [AIRDROPS INSIDER ID](https://github.com/vikitoshi/TradeGPT-Auto-Bot)