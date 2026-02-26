# Vaultium 🛡️📦

> **Secure. Decentralized. Private.**
> The next generation of cloud storage, built on IPFS and secured by Zero-Knowledge Proofs.

![Vaultium Banner](https://via.placeholder.com/1200x400?text=Vaultium+Dashboard+Preview)
*(Replace this image with a real screenshot of your dashboard)*

## 🚀 Overview

**Vaultium** is a cutting-edge decentralized storage application that leverages the power of **IPFS** for storage and **Ethereum** (Polygon Amoy Testnet) for access control. Unlike traditional cloud storage, Vaultium ensures that you—and only you—control your data.

We combine industry-leading encryption standards with **Shamir's Secret Sharing** and **Zero-Knowledge Proofs (ZKPs)** to provide a platform where privacy is not just a policy, but a mathematical guarantee.

## ✨ Key Features

- **🌐 Decentralized Storage**: All files are stored on IPFS via Pinata, ensuring redundancy and censorship resistance.
- **🔐 End-to-End Encryption**: Files are encrypted client-side before they ever leave your browser.
- **🧩 Shamir's Secret Sharing**: Your private keys are split into multiple shares, preventing single points of failure.
- **🕵️ Zero-Knowledge Proofs**: Prove ownership and access rights without revealing sensitive information using `snarkjs`.
- **🎨 Modern Aesthetic**: A premium, responsive UI built with Next.js 16, Tailwind CSS 4, and Framer Motion for buttery smooth interactions.
- **⚡ Smart Contract Integration**: verifiable on-chain metadata and access management.

## 🛠️ Tech Stack

### Frontend & UI
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://greensock.com/gsap)
- **Icons**: [Lucide React](https://lucide.dev/)

### Web3 & Security
- **Blockchain Interaction**: [Ethers.js v6](https://docs.ethers.org/v6/)
- **Storage**: [IPFS](https://ipfs.tech/) via [Pinata](https://www.pinata.cloud/)
- **Cryptography**: `snarkjs` (ZKPs), `secrets.js-grempe` (SSS)

## 📸 Screenshots

| Dashboard | Upload Vault |
|:---:|:---:|
| ![Dashboard](https://via.placeholder.com/600x400?text=Dashboard) | ![Upload](https://via.placeholder.com/600x400?text=Upload+Page) |
| *Manage your files with ease* | *Securely upload to IPFS* |

| Shared Vault | Security Verification |
|:---:|:---:|
| ![Shared](https://via.placeholder.com/600x400?text=Shared+Vault) | ![Security](https://via.placeholder.com/600x400?text=ZKP+Verification) |
| *Access files shared with you* | *Verify cryptographic proofs* |

*(Note: Please update the `src` attributes above with actual paths to your screenshots)*

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

- **Node.js**: v18 or higher
- **npm** or **yarn**
- **MetaMask**: Browser extension installed and connected to the **Polygon Amoy Testnet**.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/vaultium.git
    cd vaultium/vaultium-ui
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables**
    Copy the example environment file and fill in your details:
    ```bash
    cp .env.example .env.local
    ```
    Open `.env.local` and add your keys:
    ```env
    PINATA_JWT=your_pinata_jwt_here
    NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Smart Contracts

This project relies on smart contracts deployed on the Polygon Amoy Testnet. The contract source code and deployment scripts can be found in the adjacent `smart-contracts` directory (if applicable).

> Ensure your MetaMask is connected to the correct network to interact with the Vaultium protocol.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
