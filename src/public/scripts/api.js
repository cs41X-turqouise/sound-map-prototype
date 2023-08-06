/** @typedef {import('../../db/db.js').DbItem} DbItem */
import axios from 'https://cdn.jsdelivr.net/npm/axios@1.4.0/+esm';

export const Api = {
  async get (url) {
    const response = await axios.get(url);
    return response.data;
  },
  async getAllContent () {
    return (await Api.get('/api/content')).db;
  },
  async post (url, body) {
    const response = await axios.post(url, body);
    return response.data;
  },
  async put (url, body) {
    const response = await axios.put(url, body);
    return response.data;
  },
  async delete (url) {
    const response = await axios.delete(url);
    return response.data;
  },
  async upload (url, body) {
    const response = await axios.post(url, body);
    return response.data;
  },
};
