with open(r'C:\Users\User\Desktop\TP\triathlon_lab_rendered.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

idx = 0
while True:
    idx = html.find('Yoshihiro Wada', idx)
    if idx == -1:
        break
    print(f'Match at {idx}:')
    print(html[max(0, idx-100):min(len(html), idx+300)])
    print('='*50)
    idx += len('Yoshihiro Wada')
