const a: number[] = [];
for (let i = 0; i < 1000; i++) {
  const randomNumber = Math.random();
  if (randomNumber >= 0.9) {
    a.push(randomNumber);
  }
}

console.log(a);
