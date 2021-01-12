// const myHabits = document.querySelectorAll(".my-habit-list li");
const myHabitList = document.querySelector('.my-habit-list');

//   let li = createNewHabit(habitInput.value, timeInput.value)

//   myHabitList.appendChild(li);

//   console.log(`Habit ${habitInput.value} added with ${timeInput.value} minutes`);

//   habitInput.value = "";
//   timeInput.value = "";
// })

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.cmd === 'UPDATE_DISPLAY') {
    let time = document.querySelector(`.${request.habitName}`);
    time.innerText = request.remainingTime;
  }
})

function restoreOptions() {
  chrome.storage.sync.get([
    'myHabits'
  ], function(result){
    if(result.myHabits){
      result.myHabits.forEach(habit => {
        console.log(`habit name: ${habit.habitName}. time: ${habit.timeValue}`);
        let li = createNewHabit(habit.habitName, habit.timeValue);
        myHabitList.appendChild(li);
      })
    }
  })
}

function createNewHabit(habitName, timeValue){
  let li = document.createElement("li");
  let input = document.createTextNode(habitName);
  let time = document.createElement("p");
  let habitClassName = habitName.replace(/\s+/g, '');
  time.className = habitClassName;
  let timeInput = document.createTextNode(timeValue);
  let button = document.createElement('button');

  chrome.runtime.sendMessage({cmd: 'GET_TIMER_STATUS', 'habitName': habitName}, response => {
    if(response === ""){
      button.appendChild(document.createTextNode("Start Timer"))
    } else {
      button.appendChild(document.createTextNode("Stop Timer"))
    }
  })
  
  time.appendChild(timeInput);
  li.appendChild(input);
  li.appendChild(time);
  li.appendChild(button);

  button.addEventListener('click', function() {
    if(button.innerText === "Start Timer" || button.innerText === "Restart Timer"){
      chrome.runtime.sendMessage({cmd: 'START_TIMER', 'habitName': habitName, 'habitClassName': habitClassName, 'timeValue': timeValue});
    } else if(button.innerText === "Stop Timer"){
      chrome.runtime.sendMessage({cmd: 'STOP_TIMER', 'habitName': habitName});
    }
    
    switch(button.innerText){
      case "Start Timer":
        button.innerText = "Stop Timer";
        break;
      case "Stop Timer":
        button.innerText = "Restart Timer";
        break;
      case "Restart Timer":
        button.innerText = "Stop Timer";
        break;
      default:
        button.innerText = "Start Timer";
    }
  });
  console.log(li);
  return li;
}

document.querySelector('.go-to-options').addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

document.addEventListener('DOMContentLoaded', function() {
  restoreOptions();
})