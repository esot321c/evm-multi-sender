# EVM MultiSender

This is an app that sends Ethereum and ERC-20 tokens to multipe recipients from a single wallet. The current implementation will require you to sign the transactions for each recipient, one by one. This is not idea for large airdrops but not bad for a smaller number of recipients. Future iterations will include a multisender smart contract so you only need to sign once. 

## Getting Started

1. Copy `.env.example` file and rename it to `.env`
2. Create a Wallet Connect project ID at https://cloud.walletconnect.com/sign-up and add it to the `.env` file for `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
3. Run `pnpm install`
4. Run the app with `pnpm dev` locally, or deploy to Vercel. 
5. If running locally, navigate to `http://localhost:3000`
6. Connect your wallet and add recipients using the buttons or by uploading a .csv file. 

## Adding other chains

To add other blockchains besdies Base and Ethereum, you need to add the relevant data to `/lib/constants/evm.ts` and then import that data into `components/MultiSender.tsx` properly. 