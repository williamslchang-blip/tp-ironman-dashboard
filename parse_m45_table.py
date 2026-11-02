from bs4 import BeautifulSoup

with open(r'C:\Users\User\Desktop\TP\triathlon_lab_rendered.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

idx = 609429
# parse from idx to next 200,000 characters
sub_html = html[idx:idx+250000]
soup = BeautifulSoup(sub_html, 'html.parser')

table = soup.find('table')
if table:
    rows = table.find_all('tr')
    print(f'Found table with {len(rows)} rows')
    athletes = []
    for r in rows:
        tds = r.find_all(['td', 'th'])
        vals = [td.get_text(separator=' ', strip=True) for td in tds]
        if vals:
            athletes.append(vals)
    with open(r'C:\Users\User\Desktop\TP\m45_table_parsed.txt', 'w', encoding='utf-8') as out:
        for a in athletes:
            out.write(' | '.join(a) + '\n')
    print('Saved m45_table_parsed.txt')
else:
    print('No table found in sub_html')
