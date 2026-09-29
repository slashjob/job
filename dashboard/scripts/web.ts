import localtunnel from "localtunnel";
import { spawn } from "node:child_process";
import os from "node:os";

const PORT = 8765;

const subdomain = `${os.userInfo().username}-job-skill-dashboard`.toLowerCase().replace(/[^a-z0-9-]+/g, "-");

let tunnel: localtunnel.Tunnel | undefined;

const next = spawn("next", ["dev", "-p", String(PORT)], { stdio: "inherit" });
next.on("exit", (code) => {
  tunnel?.close();
  process.exit(code ?? 0);
});

const stop = () => next.kill();
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

tunnel = await localtunnel({ port: PORT, subdomain, local_host: "127.0.0.1" });
tunnel.on("error", (error: Error) => {
  console.error(`Tunnel failed: ${error.message}`);
  stop();
});
tunnel.on("close", stop);

const password = await fetch("https://loca.lt/mytunnelpassword")
  .then((response) => response.text())
  .catch(() => "your public IP address");

console.log(`\n  Web:      ${tunnel.url}\n  Password: ${password.trim()}\n`);
if (!tunnel.url.startsWith(`https://${subdomain}.`))
  console.log(`  ${subdomain} was taken, so the tunnel got a random name.\n`);
