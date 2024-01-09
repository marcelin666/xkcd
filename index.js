const express = require('express');
const axios = require('axios');
const {js2xml} = require('xml-js');
const DOMParser = require('xmldom').DOMParser;

const app = express();
app.use(express.json());

app.post('/api/test', async (req, res) => 
{
    try 
    {
        const ids = req.body.id.split(',');
        let responses = [];
        for(let i = 0; i < ids.length; i++)
        {
            if (ids[i]==0)
            {
                throw new Error ('Произошла ошибка при обработке вашего запроса.');
            }
            let response = await getComicAndRate(ids[i]);
            responses.push(response);
        }
        res.send(js2xml({response: responses}, {compact: true}));
    } catch (error) 
    {
        console.error(error);
        res.send('Произошла ошибка при обработке вашего запроса.');
    }
});

app.listen(5002, () => console.log('Server started 5002'));

async function getComicAndRate(id) 
{
    const comicData = await getComicData(id);
    const rub_usd = await getDollarRate(comicData.day, comicData.month, comicData.year);
    return {xkcd: {...comicData, rub_usd}};
}

async function getComicData(id) 
{
    const response = await axios.get(`https://xkcd.com/${id}/info.0.json`);
    const {day, month, year, img} = response.data;
    return {day, month, year, img};
}

async function getDollarRate(day, month, year) 
{
    const date = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    const response = await axios.get(`https://www.cbr.ru/scripts/XML_daily.asp?date_req=${date}`);
    const xmlDoc = new DOMParser().parseFromString(response.data, 'text/xml');
    const valutes = xmlDoc.getElementsByTagName('Valute');
    for (let i = 0; i < valutes.length; i++) 
    {
        if (valutes[i].getElementsByTagName('CharCode')[0].childNodes[0].nodeValue == 'USD') 
        {
            return valutes[i].getElementsByTagName('Value')[0].childNodes[0].nodeValue;
        }
    }
}
