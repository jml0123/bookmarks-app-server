INSERT INTO bookmarks (id, title, url, rating, description)
    VALUES 
        (991,
        'Malicious Link',
        'https://yourescrewed.com',
        1,
        'This text contains an intentionally broken image 
        <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie); 
        alert(''you just got pretend hacked! oh noes!'');">. The image will try to load, when it fails,
         <strong>it executes malicious JavaScript</strong>');