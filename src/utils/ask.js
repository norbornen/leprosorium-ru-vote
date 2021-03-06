// @ts-check
import readline from 'readline';

/**
 * @param {string} question
 * @returns {Promise<string | null>}
 */
export async function ask(question) {
  return (new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (x) => {
      rl.close();
      if (!/\S/.test(x ?? '')) {
        resolve(null);
      } else {
        resolve(x.trim());
      }
    });
  }));
}

/**
 * @param {string} question
 * @returns {Promise<string>}
 */
export async function loopAsk(question) {
  let res = null;
  do {
    res = await ask(question);
  } while (res === null);
  return res;
}
