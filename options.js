document.querySelector('.test-notification-sound').addEventListener('click', () => {
  let soundName = document.querySelector('.notification-sound').value;
  let sound = new Audio(`sounds/${soundName}.mp3`);
  sound.play();
})

document.querySelector('.save-changes').addEventListener('click', () => {
  let soundCheckbox = document.querySelector('.notification-sound-checkbox').checked;
  let sound = document.querySelector('.notification-sound').value;
  let notificationPersist = document.querySelector('.notification-persist').checked;
  let status = document.querySelector('.save-changes-status');

  chrome.storage.sync.set({
    'notification-persist': notificationPersist,
    'notification-sound': sound,
    'notification-sound-checkbox': soundCheckbox
  }, function() {
    reloadBackgroundPage();

    status.innerText = "Saved!";
    setTimeout(() => {
      status.innerText = "";
    }, 2000)
  });
})

document.querySelector('.habit-form').addEventListener('submit', event => {
  event.preventDefault();

  let habitInput = document.querySelector('.habit-input');
  let timeInput = document.querySelector('.time-input');
  let status = document.querySelector('.submit-status');

  if(habitInput.value === "" || timeInput === ""){
    return;
  }

  console.log(habitInput.value, timeInput.value);

  let newHabit = {'habitName': habitInput.value, 'timeValue': timeInput.value, 'loop': false};

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

function restoreOptions() {
  const myHabitList = document.querySelector('.my-habit-list');
  const notificationPersist = document.querySelector('.notification-persist');
  const notificationSound = document.querySelector('.notification-sound');
  const notificationSoundCheckbox = document.querySelector('.notification-sound-checkbox');
 
  while (myHabitList.firstChild) {
    myHabitList.removeChild(myHabitList.firstChild);
  }

  chrome.storage.sync.get([
    'myHabits',
    'notification-persist',
    'notification-sound',
    'notification-sound-checkbox'
  ], function(result){
    console.log(result.myHabits);
    if(result.myHabits){
      result.myHabits.forEach(habit => {
        console.log(`habit name: ${habit.habitName}. time: ${habit.timeValue}. loop: ${habit.loop}`);
        let li = createNewHabit(habit.habitName, habit.timeValue, habit.loop);
        myHabitList.appendChild(li);
      })
    }

    notificationPersist.checked = result['notification-persist'];
    notificationSound.value = result['notification-sound'];
    notificationSoundCheckbox.checked = result['notification-sound-checkbox'];
  })
}

function createNewHabit(habitName, timeValue, loopBool){
  let li = document.createElement("li");
  let input = document.createTextNode(habitName);
  let time = document.createElement("p");
  let habitClassName = habitName.replace(/\s+/g, '');
  time.className = habitClassName;
  let timeInput = document.createTextNode(timeValue);
  let deleteButton = document.createElement("button");
  deleteButton.className = `${habitClassName}-delete`;
  deleteButton.innerText = 'Delete';
  let loopCheckbox = document.createElement("input");
  loopCheckbox.type = 'checkbox';
  loopCheckbox.className = `${habitClassName}-loop`
  loopCheckbox.checked = loopBool;
  time.appendChild(timeInput);
  li.appendChild(loopCheckbox);
  li.appendChild(input);
  li.appendChild(time);
  li.appendChild(deleteButton);

  loopCheckbox.addEventListener('change', function() {
    let checked = loopCheckbox.checked;
    chrome.storage.sync.get([
      'myHabits'
    ], function(result){
      if(result.myHabits){
        for(let i=0; i < result.myHabits.length; i++){
          console.log(result.myHabits[i].habitName);
          console.log(habitName);
          if(result.myHabits[i].habitName === habitName){
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

  deleteButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({cmd: 'DELETE_HABIT', 'habitName': habitName, 'habitClassName': habitClassName});
  });

  console.log(li);
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