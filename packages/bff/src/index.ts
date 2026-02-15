/**
 * BFF Server Entry Point
 * サーバー起動エントリポイント
 */
import { app } from './app.js';
import { config } from './config.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log('========================================');
  console.log('  Jira Priority Matrix BFF Server');
  console.log('========================================');
  console.log(`  Port:         ${PORT}`);
  console.log(`  Environment:  ${config.nodeEnv}`);
  console.log(`  Frontend URL: ${config.frontendUrl}`);
  console.log(`  Jira URL:     ${config.jiraCloudUrl}`);
  console.log('========================================');
  console.log(`  Server is running at http://localhost:${PORT}`);
  console.log('========================================');
});
