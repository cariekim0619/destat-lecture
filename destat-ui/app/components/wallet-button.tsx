import { useAccount, useDisconnect } from "wagmi";
import { Button } from "~/components/ui/button";
import { rabbykit } from "~/root";

export default function WalletButton() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    const display = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected";
    return (
      <Button
        variant="secondary"
        onClick={() => {
          disconnect();
        }}
      >
        {display} · Disconnect
      </Button>
    );
  }

  return (
    <Button
      onClick={() => {
        rabbykit.open();
      }}
    >
      Connect
    </Button>
  );
}

