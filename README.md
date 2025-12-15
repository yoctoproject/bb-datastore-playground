# bb-datastore-playground

bb-datastore-playground is an interactive tool for testing + experiementing
with <a href="https://docs.yoctoproject.org/bitbake/bitbake-user-manual/bitbake-user-manual-metadata.html">BitBake syntax</a>.


Note: This project is under construction. It is just a proof-of-concept for now. 

## Demos
Try it: https://yoctoproject.github.io/bb-datastore-playground/

For an example with actual code, try <a href="https://yoctoproject.github.io/bb-datastore-playground/?code=z%3AIIAgvCBECMkFBwMQgMoAcCmBjAlgQwBsQcA7A0jEABQE8AXACwHsSQBnGkuvADwC4kAATQ0QaAE6k6ACgAmAOgDmGOgDU846ZGCQAlLoQAhcFABM8AMInIAEgDeARQC%2BIe4ZcBmeA%2BsAVeHDAfHhomCSy1iAA7nh08KAA1BCQAPIA0gEIIows0rogdnAgxSAKIWGy6prakAA0UCAAfHgkLDQAtkwArmxi9MysdExMAIQAPFAGTgjIpOQklBxcvCBYLSAMLbIElKSyGFwYEQBGBExYANa9TABmq0z7IENM8IjCojdM4iAAbhrErAA2jV6pBDHUoBZIABdARvEQlYoSKTSG6QOx-cROPgFBTKNQaaSY3ROPRwIA#home">this link</a>.


## Technical details
This site is a static web application. Python (and BitBake) run entirely in your web browser. <a href="https://pyodide.org/en/stable/">Pyodide</a> and WebAssembly are the core technologies which make this possible.

A Web Worker is used (via <a href="https://github.com/GoogleChromeLabs/comlink">comlink</a>) to keep the UI responsive.

## Credits
Logo drawn by @jenisesc
