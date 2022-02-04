import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import React, { useEffect, useState } from "react";
import "./App.css";

// Set our network to devnet.
const network = clusterApiUrl("mainnet-beta");

const App = () => {
  // State
  const [walletAddress, setWalletAddress] = useState(null);
  const [nftList, setNftList] = useState([]);

  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");

          /*
           * The solana object gives us a function that will allow us to connect
           * directly with the user's wallet!
           */
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Connected with Public Key:",
            response.publicKey.toString()
          );

          /*
           * Set the user's publicKey in state to be used later!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found! Get a Phantom Wallet 👻");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log("Connected with Public Key:", response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  async function getNFTs() {
    const connection = new Connection(network, "processed");
    const pubKey = new PublicKey(walletAddress);
    var balance = await connection.getBalance(pubKey);
    // var accountInfo = await connection.getAccountInfo(pubKey);
    // var tokenBalance = await connection.getTokenAccountBalance(pubKey);
    var tokenOwner = await connection.getParsedTokenAccountsByOwner(pubKey, {
      programId: TOKEN_PROGRAM_ID,
    });
    console.log("Lamports: ", balance);

    for (var i = 0; i < tokenOwner.value.length; i++) {
      var val = tokenOwner.value[i];
      var tokenPublicKey = val.account.data.parsed.info.mint;

      console.log(val.account);

      fetch(
        "https://api-mainnet.magiceden.io/rpc/getNFTByMintAddress/" +
          tokenPublicKey,
        { mode: "no-cors" }
      )
        .then((res) => res.json())
        .then(
          (result) => {
            if (result.results != null) {
              setNftList((nftList) => [
                ...nftList,
                {
                  img: result.results.img,
                  attributes: JSON.stringify(result.results.attributes),
                },
              ]);
            }
          },
          (error) => {
            console.log(error);
          }
        );
    }
  }

  /*
   * We want to render this UI when the user hasn't connected
   * their wallet to our app yet.
   */
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    if (nftList == null) {
    } else {
      return (
        <div className="connected-container">
          <div className="nft-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {nftList.map((item, index) => (
              <div className="nft-item" key={index}>
                <img src={item.img} />
                {item.attributes}
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching NFTs...");
      getNFTs();
    }
  }, [walletAddress]);

  return (
    <div className="App">
      {/* This was solely added for some styling fanciness */}
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">🖼 Best NFTs ever</p>
          <p className="sub-text">
            View your NFT collection in the metaverse ✨
          </p>
          {/* Add the condition to show this only if we don't have a wallet address */}
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container"></div>
      </div>
    </div>
  );
};

export default App;