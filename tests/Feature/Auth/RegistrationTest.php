<?php

test('public registration is disabled by default', function () {
    $this->get('/register')->assertNotFound();
    $this->post('/register', [])->assertNotFound();
});
