from requests import get
from os import path, getcwd
from bs4 import BeautifulSoup
import json

CMP_LIST_URL = 'https://iabeurope.eu/cmp-list/'
CMP_OUT_FILE = 'cmp_list_full.json'
__location__ = path.realpath(path.join(getcwd(), path.dirname(__file__)))

def get_cmp_url(cmp_url_column):
    for child in cmp_url_column.contents:
        if child.name == 'a':
            return child['href']

def get_cmp_info(row):
    for child in row.contents:
        if child.name == 'td':
            if child['class'][0] == 'column-1':
                id = child.text.strip()
            elif child['class'][0] == 'column-2':
                name = child.text.strip()
            elif child['class'][0] == 'column-3':
                url = get_cmp_url(child).strip()
            elif child['class'][0] == 'column-4':
                subdomain = child.text.strip()
    return id, name, url, subdomain

def fetch_cmp_page():
    print(f'Fetching CMP list from {CMP_LIST_URL} \n...')
    try:
        r = get(CMP_LIST_URL)
    except:
        print(f'error fetching the CMP list from {CMP_LIST_URL}')
    
    print('Success!\n')
    return r.text

def scrape_cmp_list(html):
    print('Compiling list...')
    try:
        soup = BeautifulSoup(html, "html.parser")
        tables = soup.find_all("tbody", class_="row-hover")
        cmp_infos = {}
        for table in tables:
            rows  = table.contents
            for row in rows:
                if row.name == 'tr':
                    id, name, url, subdomain = get_cmp_info(row)
                    cmp_infos[id] = {
                        "name": name,
                        "url": url,
                        "subdomain": subdomain
                    }

        with open(path.join(__location__, CMP_OUT_FILE), 'w') as f_write:
            f_write.write(json.dumps(cmp_infos, indent=4))
        print(f'Done! Full list of compliant CMPs at {CMP_OUT_FILE}')
    except Exception as e:
        print(f'Error scraping cmp list: {e}')

if __name__ == "__main__":
    html = fetch_cmp_page()
    scrape_cmp_list(html)
    