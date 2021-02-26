// Plays notification sound when 'Test' button pressed
document.querySelector('.test-notification-sound').addEventListener('click', () => {
  let soundName = document.querySelector('.notification-sound').value;
  let sound = new Audio(`sounds/${soundName}.mp3`);
  sound.play();
})

// Saves changed options and refreshes background page
document.querySelector('.save-changes').addEventListener('click', () => {
  let soundCheckbox = document.querySelector('.notification-sound-checkbox').checked;
  let sound = document.querySelector('.notification-sound').value;
  let notificationPersist = document.querySelector('.notification-persist').checked;
  let sleepTimerCheckbox = document.querySelector('.sleep-timer-checkbox').checked;
  let sleepTimerStart = document.querySelector('.sleep-timer-start').value;
  let sleepTimerEnd = document.querySelector('.sleep-timer-end').value;
  let status = document.querySelector('.save-changes-status');

  chrome.storage.sync.set({
    'notification-persist': notificationPersist,
    'notification-sound': sound,
    'notification-sound-checkbox': soundCheckbox,
    'sleep-timer-checkbox': sleepTimerCheckbox,
    'sleep-timer-start': sleepTimerStart,
    'sleep-timer-end': sleepTimerEnd,
  }, function() {
    reloadBackgroundPage();

    status.innerText = "Saved!";
    setTimeout(() => {
      status.innerText = "";
    }, 2000)
  });
})

// Creates a new habit through user input and stores it
document.querySelector('.habit-form').addEventListener('submit', event => {
  event.preventDefault();

  let habitInput = document.querySelector('.habit-input');
  let timeInput = document.querySelector('.time-input');
  let status = document.querySelector('.submit-status');

  if(habitInput.value === "" || timeInput.value === ""){
    status.innerText = "Please input a value for both fields.";
      setTimeout(() => {
        status.innerText = "";
      }, 2000)
    return;
  } else if(timeInput.value <= 0){
    status.innerText = "Please input a value greater than 0.";
      setTimeout(() => {
        status.innerText = "";
      }, 2000)
    return;
  } 

  //console.log(habitInput.value, timeInput.value);

  let newHabit = {'habitName': habitInput.value, 'timeValue': timeInput.value, 'loop': false, 'id': `id-${Date.now()}`};

  chrome.storage.sync.get(['myHabits'], function(result){
    let newHabitArray = [];
    if(result.myHabits && result.myHabits.length > 0){
      newHabitArray = [...result.myHabits, newHabit];
    } else {
      newHabitArray = [newHabit]
    }
    chrome.storage.sync.set({'myHabits': newHabitArray}, function (){
      reloadBackgroundPage();

      status.innerText = "Submitted!";
      setTimeout(() => {
        status.innerText = "";
      }, 2000)

      restoreOptions();
    })
  })

  habitInput.value = "";
  timeInput.value = "";
})

// Updates the 'My Habits' List with newly added/deleted habits
function restoreOptions() {
  const myHabitList = document.querySelector('.my-habit-list');
  const notificationPersist = document.querySelector('.notification-persist');
  const notificationSound = document.querySelector('.notification-sound');
  const notificationSoundCheckbox = document.querySelector('.notification-sound-checkbox');
  const sleepTimerCheckbox = document.querySelector('.sleep-timer-checkbox');
  const sleepTimerStart = document.querySelector('.sleep-timer-start');
  const sleepTimerEnd = document.querySelector('.sleep-timer-end');
 
  while (myHabitList.firstChild) {
    myHabitList.removeChild(myHabitList.firstChild);
  }

  chrome.storage.sync.get([
    'myHabits',
    'notification-persist',
    'notification-sound',
    'notification-sound-checkbox',
    'sleep-timer-checkbox',
    'sleep-timer-start',
    'sleep-timer-end'
  ], function(result){
    //console.log(result.myHabits);
    if(result.myHabits){
      result.myHabits.forEach(habit => {
        //console.log(`habit name: ${habit.habitName}. time: ${habit.timeValue}. loop: ${habit.loop}`);
        let li = createNewHabit(habit.habitName, habit.timeValue, habit.loop, habit.id);
        myHabitList.appendChild(li);
      })
    }

    notificationPersist.checked = result['notification-persist'];
    notificationSound.value = result['notification-sound'];
    notificationSoundCheckbox.checked = result['notification-sound-checkbox'];
    sleepTimerCheckbox.checked = result['sleep-timer-checkbox'];
    sleepTimerStart.value = result['sleep-timer-start'];
    sleepTimerEnd.value = result['sleep-timer-end'];
  })
}

// Creates the habit and returns it in a li
function createNewHabit(habitName, timeValue, loopBool, id){
  let li = document.createElement("li");
  let input = document.createTextNode(habitName);

  let time = document.createElement("p");
  let timeInput = document.createTextNode(timeValue);
  time.appendChild(timeInput);

  let loopCheckbox = document.createElement("input");
  loopCheckbox.type = 'checkbox';
  loopCheckbox.checked = loopBool;

  loopCheckbox.addEventListener('change', function() {
    let checked = loopCheckbox.checked;
    chrome.storage.sync.get([
      'myHabits'
    ], function(result){
      if(result.myHabits){
        for(let i=0; i < result.myHabits.length; i++){
          //console.log(result.myHabits[i].habitName);
          //console.log(habitName);
          if(result.myHabits[i].id === id){
            let newMyHabits = [...result.myHabits];
            newMyHabits[i].loop = checked;
            chrome.storage.sync.set({'myHabits': newMyHabits}, () => {
              reloadBackgroundPage();
              restoreOptions();
            });
            break;
          }
        }
      }
    })
  })

  let deleteButton = document.createElement("button");
  deleteButton.innerText = 'Delete';

  deleteButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({cmd: 'DELETE_HABIT', 'id': id});
  });

  li.appendChild(loopCheckbox);
  li.appendChild(input);
  li.appendChild(time);
  li.appendChild(deleteButton);

  //console.log(li);
  return li;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.cmd === 'RESTORE_OPTIONS'){
    reloadBackgroundPage();
    restoreOptions();
  }
})

function reloadBackgroundPage() {
  chrome.runtime.getBackgroundPage(function(backgroundPage) {
    backgroundPage.location.reload();
  })
}

document.addEventListener('DOMContentLoaded', function() {
  restoreOptions();
})