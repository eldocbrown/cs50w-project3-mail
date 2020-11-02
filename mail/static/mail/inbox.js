document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Send email button event
  document.querySelector('#compose-form').addEventListener('submit', (e) => {
    submit_email(e);
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get latests mails from mailbox and render them
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(data => {
      data.forEach(addMail);
  })
}

function addMail(contents) {
  // Create new email
  // email container
  const email = document.createElement('div');
  email.className = 'email d-flex flex-row border border-secondary rounded';
  if (!contents.read) {
    email.className += ' bg-white'; // email not read
  } else {
    email.className += ' bg-light'; // email read
  }
  email.style.padding = '5px';
  email.style.marginBottom = '1px';
  //email.style.justifyContent = 'space-between'
  // address container
  const address = document.createElement('div');
  address.className = 'address';
  address.innerHTML = contents.sender;
  address.style.minWidth = '150px';
  address.style.maxWidth = '150px';
  address.style.overflow = 'hidden';
  email.append(address);
  // content container
  const content = document.createElement('div');
  content.className = 'd-flex justify-content-between';
  content.style.width = '100%';
  content.style.paddingLeft = '50px';
  email.append(content);
  // address container
  const subject = document.createElement('div');
  subject.className = 'subject';
  subject.innerHTML = contents.subject;
  subject.style.overflow = 'hidden';
  content.append(subject);
  // address container
  const timestamp = document.createElement('div');
  timestamp.className = 'timestamp';
  timestamp.innerHTML = contents.timestamp;
  content.append(timestamp);

  // Add post to DOM
  document.querySelector('#emails-view').append(email);
}

function submit_email(e) {

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  e.preventDefault();

  fetch('/emails', {
  method: 'POST',
  body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      if (result.error === undefined) {
        load_mailbox('sent');
        alert(result.message);
      } else {
        throw new Error(result.error);
      }
  })
  .catch((error) => {
    console.error('Error!:', error);
    alert(error);
    load_mailbox('inbox');
  });
}
