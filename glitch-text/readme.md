# glitch-text
a web component that's well... glitchy

---------------

## Demo
[View the demo](https://ryan-appel.com/web-components/glitch-text/)

## Features 

- Simple to use
- Minified JS (2.12k)
- Use html attributes or JS to control

## Usage

1. Add the script tag to your <head> element.
```html
<script src="glitch-text.js"></script>
```
2. Use the <glitch-text> tag anywhere you want. (used here with the "run" attribute)
```html
<glitch-text run>This is glitchy a.f.</glitch-text>
```

## API

### Methods

| Method | Parameters | Return Value | Description |
| ------ | ------ | ------ | ------ |
| start() | null | null | Will run the glitch-text if currently stopped. Will have no effect if already running. |
| stop() | null | null | Will stop the glitch-text if currently running. Will have no effect if already stopped. |
| toggle() | null | null | Will start the glitch-text if currently stopped, otherwise it will stop it. |
| isRunning() | null | bool | Returns true if the glitch-text is running, false otherwise. |

### Attributes

| Attribute | Type / Values (Default) | Example | Description |
| ------ | ------ | ------ | ------ |
| run | bool / none (default: false) | ```<glitch-text run>Hello world<glitch-text>``` | Will run the start function automatically when the element is mounted. **Note:** the attribute should not contain a value. Using run="some value" may cause unexpected behavior. |
| glyphs | string (default: "<>_\\/[]+^") | ```<glitch-text glyphs="][?">Hello world<glitch-text>``` | The characters in the specified string will be used to replace characters in the given glitch-text. In this example, the square brackets and the question mark will be the used to glitch the Hello world text. |
| ignore | string (default: " ") | ```<glitch-text ignore=" []">[Hello world]<glitch-text>``` | Characters that will not be changed to glyphs while running. In this example, the characters in "Hello" and "world" will change, but the square brackets, and the space separating the words will stay unchanged |
| speed | number / range between 0-1 (default: 0.05) | ```<glitch-text speed="0.15">Hello world<glitch-text>``` | A modifier for how fast characters in the text are changed to glyphs. A value of 1 would, in theory, change every character every second, making the text basically un-readable. 0.5 would be 50% of characters every second! Don't be surprised if you use numbers like 0.02 or smaller! The size of the string is accounted for when calculating the overall speed, so small glyph-text elements should look similar to large ones with the same speed |
| drop | number / range between 0-1 (default: 0) | ```<glitch-text drop="0.5" speed="0.85">Hello world<glitch-text>``` | The number of "frames" that are dropped. This works well with higher speeds to make the glitch-text feel more choppy. |
| duration | number (default: 250) | ```<glitch-text duration="150">Hello world<glitch-text>``` | The duration (in milliseconds) that glyphs will hold, before turning back to the original character. |


### Properties

You can change any attribute (except for "run"), by using the attribute name as a property. For example:
```js
const glitchText = document.querySelector('glitch-text')
glitchText.glyphs = "*"
glitchText.speed = 0.03
```
The previous code changes the glyph symbol to an asterisk, and the speed to 0.03. Changing properties will take affect immediately. Even if the glitch-text is running.

### Other Notes
```<glitch-text>``` elements should NOT contain any other elements including line breaks.

### License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.