const myHabitList = document.querySelector('.my-habit-list');

// Updates the remaining time on active timers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.cmd === 'UPDATE_DISPLAY') {
    let time = document.querySelector(`#${request.id}`);
    time.innerText = request.remainingTime;
  }
})

// Displays updated popup
function restoreOptions() {
  chrome.storage.sync.get([
    'myHabits'
  ], function(result){
    if(result.myHabits){
      result.myHabits.forEach(habit => {
        //console.log(`habit name: ${habit.habitName}. time: ${habit.timeValue}`);
        let li = createNewHabit(habit.habitName, habit.timeValue, habit.id);
        myHabitList.appendChild(li);
      })
    }
  })
}

// Creates the habit name, timer, and button and returns it in a li
function createNewHabit(habitName, timeValue, id){
  let li = document.createElement("li");
  let input = document.createTextNode(habitName);

  let time = document.createElement("p");
  let timeInput = document.createTextNode(timeValue);
  time.id = id;

  let button = document.createElement('button');

  chrome.runtime.sendMessage({cmd: 'GET_TIMER_STATUS', 'id': id}, response => {
    if(response === ""){
      button.appendChild(document.createTextNode("Start Timer"))
    } else {
      button.appendChild(document.createTextNode("Stop Timer"));
      console.log(response);
      timeInput = document.createTextNode(response);
    }
    time.appendChild(timeInput);
  })
  
  
  button.addEventListener('click', function() {
    if(button.innerText === "Start Timer" || button.innerText === "Restart Timer"){
      chrome.runtime.sendMessage({cmd: 'START_TIMER', 'habitName': habitName, 'id': id, 'timeValue': timeValue});
    } else if(button.innerText === "Stop Timer"){
      chrome.runtime.sendMessage({cmd: 'STOP_TIMER', 'id': id});
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

  li.appendChild(input);
  li.appendChild(time);
  li.appendChild(button);

  //console.log(li);
  return li;
}

// Opens options page when 'Create a New Habit' button is clicked
document.querySelector('.go-to-options').addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});

// Displays updated popup page whenever it is reopened
document.addEventListener('DOMContentLoaded', function() {
  restoreOptions();
})