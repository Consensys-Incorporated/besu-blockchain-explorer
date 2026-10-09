# Besu Explorer

A lightweight explorer for private [Hyperledger Besu](https://besu.hyperledger.org/) networks. It gives you a quick overview of your chain without the setup cost of a full indexer such as Blockscout:

- **Nodes**: status, block height, peers, pending transactions and node identity

  ![Nodes page](nodes.png)

- **Validators**: view the validator set, and propose or discard votes (QBFT, IBFT 2.0 and Clique)

  ![Validators page](validators.png)

- **Explorer**: latest blocks and transactions, with lookup by block number or transaction hash

  ![Explorer page](explorer.png)

- **Contracts**: compile Solidity in the browser, then deploy and call contracts through MetaMask

  ![Contracts page](contracts.png)

- **Wallets**: send ETH through MetaMask

  ![Wallets page](wallets.png)


It has not been designed for production use yet.

## Tech stack

Next.js 16 (Pages Router), React 19, TypeScript, Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/), ethers v6 and NextAuth.

## Prerequisites

- [Node.js](https://nodejs.org/) 24 LTS
- [Docker](https://www.docker.com/) (optional)
- A Besu network, for example from the [Besu Dev Quickstart](https://www.npmjs.com/package/@consensys-software/besu-dev-quickstart)

The explorer calls these JSON-RPC API groups, so enable them on each node with `--rpc-http-api`:

| API group | Used for |
| --- | --- |
| `ETH`, `NET` | blocks, transactions, chain ID, peer count |
| `ADMIN` | node info and peer list |
| `TXPOOL` | pending transaction count (optional) |
| `QBFT`, `IBFT` or `CLIQUE` | the validators page (match your consensus) |

## Configuration

Create a config file listing the nodes to monitor. See [`src/config/config.json`](../src/config/config.json):

```json
{
  "algorithm": "qbft",
  "nodes": [
    { "name": "rpcnode", "rpcUrl": "http://127.0.0.1:8545" },
    { "name": "validator1", "rpcUrl": "http://127.0.0.1:21001" }
  ]
}
```

- `algorithm`: `qbft`, `ibft` (IBFT 2.0) or `clique`
- `name`: any unique label
- `rpcUrl`: the node's HTTP JSON-RPC endpoint, reachable from the explorer's server

The server only proxies requests to the `rpcUrl`s in this file and only for an allow-list of RPC methods.

## Local development

1. Create `.env.local` in the project root:

   ```bash
   QE_BASEPATH="/explorer"
   QE_CONFIG_PATH="src/config/config.json"
   DISABLE_AUTH=true
   NEXTAUTH_URL=http://localhost:25000/explorer/api/auth
   ```

2. Start the app:

   ```bash
   npm install
   npm run dev
   ```

3. Open <http://localhost:25000/explorer>.

Other scripts: `npm run build`, `npm start`, `npm run lint` and `npm run typecheck`.

### UI components

UI primitives live in `src/components/ui` and come from shadcn/ui. To add another one:

```bash
npx shadcn@latest add <component>
```

## Production

Enable authentication in production. Set the values in `.env.production`:

- **NEXTAUTH_SECRET** (required): generate one with `openssl rand -hex 32`.
- **DISABLE_AUTH**: set to `false` to require sign-in. You then need at least one provider configured below.

### Options

| Variable | Description |
| --- | --- |
| `QE_BASEPATH` | URL base path, default `/explorer`. Baked in at build time. |
| `QE_CONFIG_PATH` | Path to the node config file. The Docker image expects `/app/config.json`. |
| `DISABLE_AUTH` | `true` turns authentication off. Any other value requires sign-in. |
| `NEXTAUTH_URL` | Public URL of the auth API, including the base path, for example `https://example.com/explorer/api/auth`. |
| `NEXTAUTH_SECRET` | Secret used to sign sessions. |
| `local_username`, `local_password` | Simple username/password sign-in, convenient for testing. Not recommended for production. |

OAuth providers are enabled when all of their variables are set: GitHub, GitLab, Google, Facebook, Twitter, Auth0, Azure AD, Atlassian, Cognito, Okta and Slack. See `.env.production` for the variable names.

### Docker Compose

```yaml
services:
  explorer:
    image: consensys/besu-explorer:latest
    volumes:
      - ./config.json:/app/config.json
      - ./.env.production:/app/.env.production
    ports:
      - 25000:25000/tcp
```

Both files **must** be provided.

### Building your own image

The image is based on Ubuntu 26.04 with Node.js 24 LTS and runs as a non-root user.

```bash
docker build . -t YOUR_IMAGE:TAG
```

`QE_BASEPATH` is read from `.env.production` at build time. Rebuild the image if you change it.

## Troubleshooting

### Deploying a contract fails with an invalid opcode

Solidity 0.8.20 and later targets the Shanghai EVM by default and emits `PUSH0`. If your genesis doesn't enable Shanghai, pick an older target such as `london` or `paris` from the **EVM** selector on the Contracts page. The default is `london`.

### MetaMask transaction is stuck

This happens when you reuse a MetaMask account after resetting your network, because the account's nonce no longer matches the chain.

**Back up your private keys or seed phrase before doing this.**

1. Select the account in MetaMask.
2. Go to **Settings → Advanced** and click **Clear activity tab data** (previously "Reset account").
3. Repeat for each account used on the network, then retry the transaction.

## Contributing

We welcome PRs for bugs or new features. Please sign the CLA and submit a PR for review. If you raise an issue, include steps to reproduce it.
