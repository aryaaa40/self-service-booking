import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'http://localhost:3000';
const today = new Date().toISOString().split('T')[0];
const URL = `${BASE_URL}/jadwal?spesialisasi=Jantung%20%26%20Pembuluh%20Darah&dari_tanggal=${today}`;

export const options = {
  vus: 50,
  duration: '30s',
};

export default function () {
  const res = http.get(URL);
  check(res, {
    'status 200': (r) => r.status === 200,
  });
}
