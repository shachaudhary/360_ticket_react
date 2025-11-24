import axios from 'axios';

export const createAPIEndPointAppointment = (endpoint) => {
  const BASE_URL = 'https://api.appointment.dental360grp.com/api';
  const X_API_Key = import.meta.env.VITE_APP_X_API_Key;

  let token = typeof localStorage !== 'undefined' && localStorage.getItem('access_token');

  let url = `${BASE_URL}/${endpoint}`;
  return {
    fetchAll: () =>
      axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key,
          "ngrok-skip-browser-warning": "true",
        },
      }),
    create: (newRecord) =>
      axios.post(url, newRecord, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key,
          "ngrok-skip-browser-warning": "true",
        },
        withCredentials: true,
      }),
    createWithJSONFormat: (newRecord) =>
      axios.post(url, newRecord, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key,
          "ngrok-skip-browser-warning": "true",
        },
        withCredentials: true,
      }),
    fetchById: (id) =>
      axios.get(url + id, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key,
          "ngrok-skip-browser-warning": "true",
        }
      }),
    delete: (id) =>
      axios.delete(url + id, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key,
          "ngrok-skip-browser-warning": "true",
        }
      }),
    fetchFiltered: (params) =>
      axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': X_API_Key,
          "ngrok-skip-browser-warning": "true",
        },
        params
      }),
    update: (id, updatedRecord) =>
      axios.put(
        url + id,
        updatedRecord,
        token !== null && {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-API-Key': X_API_Key,
            "ngrok-skip-browser-warning": "true",
          },
        }
      ),
    patch: (updatedRecord) =>
      axios.patch(
        url,
        updatedRecord,
        token !== null && {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-API-Key': X_API_Key,
            "ngrok-skip-browser-warning": "true",
          },
        }
      ),
    patchWithId: (id, updatedRecord) =>
      axios.patch(`${url}/${id}`, updatedRecord, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-API-Key": X_API_Key,
          "ngrok-skip-browser-warning": "true",
        },
      }),
  };
};

