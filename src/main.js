import './styles/index.js';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Component } from './site/Component.js';
import { bindTemplate } from './runtime/dc.js';
import render from './template/page.html?dc'; // compiled at build time by build/vite-plugin-dc.js

bindTemplate(Component, render);
createRoot(document.getElementById('root')).render(createElement(Component));
