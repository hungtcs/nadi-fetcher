#!/usr/bin/env ts-node
import fs from 'fs';
import sleep from 'sleep';
import axios from 'axios';
import { Area } from './model/models';

const DIST_PATH = `${ __dirname }/data`
const JSON_DIST_PATH = `${ __dirname }/data/json`
const SLEEP_MILLISECOND = 1000;

const cookie = `acw_tc=276082a915688654877642367ee6b46597d7da86b4ac6761a7086e7ab386c9; SERVERID=2d32e8a1d3128ae64227fc5ec55507c7|1568865485|1568865485; _gscu_1088464070=68863211bgevmh12; _gscbrs_1088464070=1; _gscs_1088464070=68865488i4dk4d95|pv:1`;

async function fetch(code: string) {
  console.log(`start fetch ${ code }`);
  const response = await axios.request({
    url: 'http://bmfw.www.gov.cn/ZFW-AccessPlatform/front/administrativedivision/queryAreaInfo.do',
    method: 'GET',
    params: { code },
    headers: {
      'Cookie': cookie,
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Accept-Language': 'zh-CN,zh,zh-TW,en-US,en',
    },
  });
  return response.data;
}

async function downloadIndex(): Promise<Array<Area>> {
  console.log(`start download index`);
  const data = await fetch('100000');
  const list = JSON.parse(data.message).list;
  fs.writeFileSync(`${ JSON_DIST_PATH }/all.json`, JSON.stringify(list, null, 2), { encoding: 'utf-8' });
  return list;
}

async function fetchProvinces(provinces: Array<Area>) {
  if(provinces.length > 0) {
    const province = provinces.pop();
    
    const data = await fetch(province.code);
    
    const provincesData = JSON.parse(data.message);
    provincesData.name = province.name;
    provincesData.code = province.code;
    provincesData.area = provincesData.shengArea;
    provincesData.shenghui = provincesData.shenghui.replace(/\((?:中华人民共和国|省会|首府)(\S+)\)/, '$1');
    provincesData.population = provincesData.shengPopulation;
    delete provincesData.shengArea;
    delete provincesData.shengPopulation;

    console.log(`write file ${ province.code }.json`);
    fs.writeFileSync(`${ JSON_DIST_PATH }/${ province.code }.json`, JSON.stringify(provincesData, null, 2), { encoding: 'utf-8' });
    console.log('---------------------------------------------------');
    sleep.msleep(SLEEP_MILLISECOND);
    
    await fetchProvinces(provinces);
  }
}

async function removeOldFiles() {
  console.log(`remove old json files`);
  fs.readdirSync(JSON_DIST_PATH).forEach(file => fs.unlinkSync(`${ JSON_DIST_PATH }/${ file }`));
}

async function main() {
  await removeOldFiles();
  const list = await downloadIndex();
  const provinces = list.filter(item => item.level === '省级');
  fs.writeFileSync(`${ JSON_DIST_PATH }/provinces.json`, JSON.stringify(provinces, null, 2), { encoding: 'utf-8' });
  await fetchProvinces(provinces);
}

main().then(() => {
  console.log('done!');
  fs.writeFileSync(`${ DIST_PATH }/.datetime`, `${ new Date().toUTCString() }`, { encoding: 'utf-8' });
}).catch(err => {
  console.error(err);
  process.exit(1);
});
