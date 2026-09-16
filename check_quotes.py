with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

count = text.count(chr(92) + chr(34))
print(f'Count of backslash-quote: {count}')
if count > 0:
    print('Found escaped quotes in app.js! Cleaning up...')
    text = text.replace(chr(92) + chr(34), chr(34))
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Cleaned up!')
