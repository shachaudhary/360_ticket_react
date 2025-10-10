import axios from 'axios';

export const createAPIEndPointAuth = (endpoint) => {
  const BASE_URL = import.meta.env.VITE_APP_BASE_URL_AUTH;
  const X_API_Key = "d83dabcea80d37864dfd2f5c99c075fe475cccb31998bda99f8978e3e5897ac7";

  console.log("VITE_APP_X_API_KEY_V2 0.2", import.meta.env.VITE_APP_X_API_KEY_V2); 

  let token = typeof localStorage !== 'undefined' && localStorage.getItem('access_token');

  let url = `${BASE_URL}/${endpoint}`;
  return {
    fetchAll: () =>
      axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key
        }
      }),
    create: (newRecord) =>
      axios.post(url, newRecord, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key
        }
      }),
    fetchById: (id) =>
      axios.get(url + id, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key
        }
      }),
    delete: (id) =>
      axios.delete(url + id, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key
        }
      }),
    fetchFiltered: (params) =>
      axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key
        },
        params // Include query parameters
      }),
    update: (id, updatedRecord) =>
      axios.put(url + id, updatedRecord, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key
        }
      })
  };
};
