// Package
require('dotenv').config();
const axios = require('axios');
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')(); // Import prompt-sync correctly

// Config RPC 0GLabs Testnet
const configNetwork = {
  rpc: 'https://evmrpc-testnet.0g.ai/',
  chainId: 16601,
  symbol: '0G',
  explorer: 'https://chainscan-galileo.0g.ai/'
};

const reset = "\x1b[0m";
const red = "\x1b[31m";
const white = "\x1b[37m";
const bold = "\x1b[1m";
const cyan = "\x1b[36m";

// Banner WIQI
console.log(`${bold}$${white}======= TradeGPT BOT - Made from ${red}♥${white} by Wiqi =======${reset}`);

// Load Privkey Wallet or Mnemonic Phrase
const loadWallet = () => {
  const privKeys = [];

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('PRIVATE_KEY_') && value) {
      privKeys.push(value);
    } else if (key.startsWith('MNEMONIC_PHRASE_') && value) {
      try {
        const wallet = ethers.Wallet.fromMnemonic(value.trim());
        privKeys.push(wallet.privateKey);
      } catch (err) {
        console.error(`Invalid Mnemonic Phrase in ${key}: ${err.message}`);
      }
    }
  }
  return privKeys;
};

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) Gecko/20100101 Firefox/117.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Data Router, ABI, CA Token
const contractAddyUSDT = '0xe6c489b6d3eeca451d60cfda4782e9e727490477';
const contractAddyNEIZ = '0x5d77d8bd959Bfb48c55E19199df54C7ab23f3e4d';
const addyRouter = '0xDCd7d05640Be92EC91ceb1c9eA18e88aFf3a6900';
const uniswapRouterABI = [
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
];

const ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

async function infoWallet(wallet, provider, walletAddress) {
  try {
    const addyUSDT = new ethers.Contract(contractAddyUSDT, ABI, provider);
    const usdtBalance = await addyUSDT.balanceOf(walletAddress);
    const pointWallet = await walletPoints(walletAddress);

    return { usdtBalance, pointWallet };
  } catch (error) {
    console.error(`Failed to fetch info from wallet ${walletAddress}: ${error.message}`);
    throw error;
  }
}

async function checkPoint(walletAddress) {
  const urlPoints = `https://trade-gpt-800267618745.herokuapp.com/points/${walletAddress.toLowerCase()}`;
  try {
    const { data } = await axios.get(urlPoints, getHeaders());
    return data;
  } catch (error) {
    console.log(`${red}[✗] Failed to fetch points for wallet ${walletAddress}: ${error.message} ${reset}`);
    return null;
  }
}

function getHeaders() {
  return {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json',
      'User-Agent': getRandomUserAgent(),
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-GPC': '1',
      'Referer': 'https://0g.app.tradegpt.finance/',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  };
}

async function showAllInfo(privKeys, provider, numPrompts) {
  for (const privKey of privKeys) {
    try {
      const wallet = new ethers.Wallet(privKey, provider);
      const walletAddy = wallet.address;

      console.log(`\nWallet: ${walletAddy}`);

      const { usdtBalance, pointWallet } = await infoWallet(wallet, provider, walletAddy);
      const formattedUSDT = ethers.utils.formatUnits(usdtBalance, 18);

      console.log(`USDT BALANCE: ${formattedUSDT}`);
      if (pointWallet) {
        console.log(`Points: ${JSON.stringify(pointWallet)}`);
      } else {
        console.log('Points data not available.');
      }

      // Send random chat prompts
      for (let i = 0; i < numPrompts; i++) {
        const randomPrompt = getRandomPrompt();
        await sendChat(walletAddy, randomPrompt);

        const swapAmount = extractAmountFromPrompt(randomPrompt);
        await performSwap(wallet, provider, swapAmount, walletAddy);
      }

    } catch (err) {
      console.error(`Error fetching info for wallet: ${err.message}`);
    }
  }
}


async function walletPoints(walletAddress) {
  return await checkPoint(walletAddress);
}

// Load json Random Prompt
const prompts = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'randomPrompt.json'), 'utf-8'));

function getRandomPrompt() {
  return prompts[Math.floor(Math.random() * prompts.length)];
}

// Extract the amount from the prompt string
function extractAmountFromPrompt(prompt) {
  const match = prompt.match(/Swap (\d+(\.\d{1,2})?) USDT to/);  // This regex will extract the number (e.g. 10 from 'Swap 10 USDT to')
  return match ? match[1] : '0.1';  // Default to 0.1 if no amount is found
}

async function sendChat(walletAddress, prompt) {
  const urlChat = 'https://trade-gpt-800267618745.herokuapp.com/ask/ask';
  prompt = prompt ?? getRandomPrompt();
  const payload = {
    chainId: configNetwork.chainId,
    user: walletAddress,
    questions: [{
      question: prompt,
      answer: '',
      baseMessage: {
        lc: 1,
        type: 'constructor',
        id: ['langchain_core', 'messages', 'HumanMessage'],
        kwargs: { content: prompt },
      },
    }],
    testnetOnly: true,
  };

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log(`[⟳] Sending chat request for wallet ${walletAddress}: "${prompt}" (Attempt ${attempt + 1})`);
      const response = await axios.post(urlChat, payload, getHeaders());
      console.log(`[✓] Chat request successful for wallet ${walletAddress}: ${prompt}`);
      return response.data;
    } catch (error) {
      attempt++;
      console.log(`[✗] Chat request failed for wallet ${walletAddress}: ${error.message}`);
      if (attempt >= maxRetries) {
        console.log(`[✗] Maximum retry attempts reached. Aborting request for wallet ${walletAddress}.`);
        throw error;
      }
      const delayMs = 3000;
      console.log(`[i] Retrying in ${delayMs / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// Perform the Swap
async function performSwap(wallet, provider, amountUSDT, walletAddress) {
  try {
    const { usdtBalance, usdtDecimals, nativeBalance } = await infoWallet(wallet, provider, walletAddress);
    const amountIn = ethers.utils.parseUnits(amountUSDT.toString(), usdtDecimals);

    if (usdtBalance < amountIn) {
      throw new Error(`Insufficient USDT balance: ${ethers.formatUnits(usdtBalance, usdtDecimals)} USDT`);
    }
    if (nativeBalance < ethers.utils.parseEther('0.001')) {
      throw new Error(`Insufficient OG balance for gas: ${ethers.formatEther(nativeBalance)} OG`);
    }

    const path = [contractAddyUSDT, contractAddyNEIZ];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

    const url = 'https://trade-gpt-800267618745.herokuapp.com/ask/ask';
    const payload = {
      chainId: configNetwork.chainId,
      user: walletAddress,
      questions: [{
        question: `Swap ${amountUSDT} USDT to NEIZ`,
        answer: '',
        baseMessage: {
          lc: 1,
          type: 'constructor',
          id: ['langchain_core', 'messages', 'HumanMessage'],
          kwargs: { content: `Swap ${amountUSDT} USDT to NEIZ`, additional_kwargs: {}, response_metadata: {} },
        },
      }],
      testnetOnly: true,
    };

    console.log(`Fetching swap details for ${amountUSDT} USDT to NEIZ`);
    const response = await axios.post(url, payload, { headers: getHeaders() });
    const swapData = JSON.parse(response.data.questions[0].answer[0].content);

    if (!swapData.amountOutMin) {
      throw new Error('Invalid swap data: amountOutMin is undefined');
    }

    const amountOutMin = ethers.utils.parseUnits(swapData.amountOutMin.toString(), 18);

    const usdtContract = new ethers.Contract(contractAddyUSDT, ABI, wallet);
    console.log(`Approving USDT for Uniswap Router for wallet ${walletAddress}`);
    const approveTx = await usdtContract.approve(addyRouter, amountIn, { gasLimit: 100000 });
    await approveTx.wait();
    console.log(`USDT approval successful for wallet ${walletAddress}`);

    const router = new ethers.Contract(addyRouter, uniswapRouterABI, wallet);
    console.log(`Initiating swap of ${amountUSDT} USDT to NEIZ for wallet ${walletAddress}`);
    const tx = await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      walletAddress,
      deadline,
      { gasLimit: 200000 }
    );

    console.log(`Waiting for transaction confirmation: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Swap successful! Tx Hash: ${tx.hash}`);

    // Log the transaction
    const logResponse = await logTransaction(walletAddress, amountUSDT, receipt.transactionHash);
    console.log(`Transaction logged successfully: - [✓] "status": "${logResponse.data.status}"`);

    return receipt;
  } catch (error) {
    console.error(`Swap failed for wallet ${walletAddress}: ${error.message}`);
    throw error;
  }
}

// Log transaction function
async function logTransaction(walletAddress, amountUSDT, txHash) {
  const urlLog = 'https://trade-gpt-800267618745.herokuapp.com/log/logTransaction';
  const payload = {
    walletAddress,
    chainId: configNetwork.chainId,
    txHash,
    amount: amountUSDT.toString(),
    usdValue: amountUSDT,
    currencyIn: 'USDT',
    currencyOut: 'NEIZ',
    timestamp: Date.now(),
    timestampFormatted: new Date().toISOString(),
  };
  try {
    const response = await axios.post(urlLog, payload, { headers: getHeaders() });
    return response;
  } catch (error) {
    console.error(`Failed to log transaction ${txHash}: ${error.message}`);
    throw error;
  }
}
// Main function
(async () => {
  const privKeys = loadWallet();
  if (privKeys.length === 0) {
    console.log('No wallets found in .env file. Please add PRIVATE_KEY_ or MNEMONIC_PHRASE_ variables.');
    return;
  }

  const numPrompts = parseInt(prompt('Enter the number of random chat prompts to send per wallet: '));
  if (isNaN(numPrompts) || numPrompts < 1) {
    console.error('Invalid number of prompts. Exiting...');
    return;
  }

  const provider = new ethers.providers.JsonRpcProvider(configNetwork.rpc);
  await showAllInfo(privKeys, provider, numPrompts);

  console.log('Bot execution completed');
})();
