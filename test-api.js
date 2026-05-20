import fs from 'fs';
fetch('https://ais-dev-qozowgqyuermlttlss6jan-387428370124.asia-southeast1.run.app/api/contacts')
  .then(async res => {
    console.log('Status:', res.status);
    console.log('OK:', res.ok);
    console.log('Body:', await res.text());
  });
