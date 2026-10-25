import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server.browser';
globalThis.React = React;
globalThis.renderLessonComponent = component => renderToStaticMarkup(React.createElement(component));
