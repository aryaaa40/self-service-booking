import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 9,
  iterations: 9,
};

const BASE_URL = 'http://localhost:3000';
const JADWAL_ID = 5;

const PASIEN_IDS = [1, 2, 3, 4, 5, 6, 8, 10, 11];

export default function () {
  const pasienId = PASIEN_IDS[__VU - 1];

  const res = http.post(
    `${BASE_URL}/booking`,
    JSON.stringify({
      pasien_id: pasienId,
      jadwal_dokter_id: JADWAL_ID,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'berhasil (201)': (r) => r.status === 201,
    'slot penuh (400)': (r) => r.status === 400,
    'rate limited (429)': (r) => r.status === 429,
  });

  console.log(`VU ${__VU} (pasien ${pasienId}): status=${res.status}`);
}
