from bs4 import BeautifulSoup
import re
import json

with open(r'C:\Users\User\Desktop\TP\triathlon_lab_rendered.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

# Let's search all data-athlete-race-record-trigger or JSON objects
# In HTML, let's look for M45-49 section in Division file
# Look for 'M45-49'
# Let's find the section where "65" and "ranked" appears
idx_65 = html.find('65')
while idx_65 != -1:
    snip = html[max(0, idx_65-50):min(len(html), idx_65+150)]
    if 'ranked' in snip and 'M45-49' in html[max(0, idx_65-200):idx_65+200]:
        print('Found M45 header at', idx_65)
        print(html[idx_65-200:idx_65+500])
        break
    idx_65 = html.find('65', idx_65 + 1)
