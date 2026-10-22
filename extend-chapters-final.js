const fs = require('fs');

function appendText(chFile, additionalText) {
  const current = fs.readFileSync(chFile, 'utf8');
  fs.writeFileSync(chFile, current.trim() + '\n\n' + additionalText.trim() + '\n', 'utf8');
}

// CH09 추가 (약 150자)
appendText('chapters/ch09.txt', `<!-- CH09-P016 -->
지훈이가 건넨 캔커피의 온기가 손바닥을 타고 가슴 깊은 곳까지 번져나갔다. 혼자서 달리면 빨리 갈 수 있을지 몰라도, 함께 어깨를 겯고 달릴 때 비로소 우리는 지치지 않고 가장 멀리까지 도달할 수 있다는 평범하지만 거대한 진리를 가슴에 새겼다.`);

// CH10 추가 (약 160자)
appendText('chapters/ch10.txt', `<!-- CH10-P016 -->
발표를 마친 뒤 동료들과 함께 먹었던 저녁 식사 자리에서, 우리는 서로의 손을 맞잡으며 뜨거운 눈시울을 붉혔다. 포기하지 않고 한계를 넘어선 우리 모두가 승자였다. 그 뜨거웠던 프로젝트의 밤들은 내 청춘이 남긴 가장 눈부시고 단단한 영광의 훈장이었다.`);

// CH04 추가 (약 150자)
appendText('chapters/ch04.txt', `<!-- CH04-P015 -->
책상 위에 놓인 형광펜 잉크가 닳아 없어질 때마다, 내 안의 낡은 방황도 서서히 지워져 갔다. 남들보다 늦은 만큼 더 깊이 파고들었고, 남들이 지나친 사소한 명령어 하나까지도 온전히 내 것으로 체화했다. 그것이 내가 세상의 속도를 따라잡은 유일한 비결이었다.`);

console.log('Final milestone reached.');
