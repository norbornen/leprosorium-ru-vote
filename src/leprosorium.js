// @ts-check
import got from 'got';
import dotenv from 'dotenv';

dotenv.config();

const Agent = got.extend({
  prefixUrl: 'https://leprosorium.ru/api/',
  headers: {
    'X-Futuware-SID': process.env['X-Futuware-SID'],
    'X-Futuware-UID': process.env['X-Futuware-UID'],
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'
  },
  responseType: 'json',
  timeout: 15 * 1000
});

/**
 * @param { string } userName
 * @returns { Promise<{ [key: string]: any; user_info: Record<string, any>; }> }
 */
async function getUserProfile(userName) {
  const { body } = await Agent.get(`users/${userName}/info/`, { responseType: 'json' });
  return body;
}

/**
 * @param { string } userName
 * @param { number } [limit]
 * @returns { Promise<Array<Record<string, any>>> }
 */
async function getUserPosts(userName, limit) {
  return getUserRecords(userName, 'posts');
}

/**
 * @param { string } userName
 * @param { number } [limit]
 * @returns { Promise<Array<Record<string, any>>> }
 */
async function getUserComments(userName, limit) {
  return getUserRecords(userName, 'comments', limit);
}

/**
 * @param { number } item_id
 * @param { number } [vote]
 * @returns { Promise<any> }
 */
async function votePost(item_id, vote) {
  return voteRecord('posts', item_id, vote);
}

/**
 * @param { number } item_id
 * @param { number } [vote]
 * @returns { Promise<any> }
 */
async function voteComment(item_id, vote) {
  return voteRecord('comments', item_id, vote);
}

/**
 * @param { string } userName
 * @param { string } endpoint
 * @param { number } [limit]
 * @returns { Promise<Array<Record<string, any>>> }
 */
async function getUserRecords(userName, endpoint, limit) {
  const iterator = Agent.paginate(`users/${userName}/${endpoint}/`, {
    searchParams: {
      page: 1,
      per_page: 25
    },
    pagination: {
      transform: (response) => (response?.body?.[endpoint] || []),
      paginate: (response, allItems, currentItems) => {
        const previousSearchParams = response.request.options.searchParams;
        const previousPerPage = +previousSearchParams.get('per_page');
        const previousPage = +previousSearchParams.get('page');

        if (!currentItems || currentItems.length < previousPerPage) {
          return false;
        }

        console.log(`page ${previousPage + 1}`);
        return {
          searchParams: { per_page: previousPerPage, page: previousPage + 1 }
        };
      }
    }
  });

  const records = [];
  for await (const item of iterator) {
    if (item) {
      records.push(item);
    }
    if (limit && limit <= records.length) {
      break;
    }
  }

  return records;
}

/**
 * @param { string } endpoint
 * @param { number } item_id
 * @param { number } [vote=0]
 * @returns { Promise<any> }
 */
async function voteRecord(endpoint, item_id, vote = 0) {
  return Agent.post(`${endpoint}/${item_id}/vote/`, { json: { vote } });
}

export default {
  agent: Agent,
  getUserProfile,
  getUserPosts,
  getUserComments,
  votePost,
  voteComment,
};
