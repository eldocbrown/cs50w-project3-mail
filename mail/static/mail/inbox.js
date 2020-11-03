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

  document.querySelector('#archiverButton').addEventListener('click', (e) => {
    let action = 'archive';
    if (document.querySelector('#email-archived').dataset.archived === 'true') {
      action = 'unarchive';
    }
    archiver(document.querySelector('#email-id').dataset.id, action);
  });

  document.querySelector('#replyButton').addEventListener('click', (e) => {
    compose_email();

    reply_email(
      event.currentTarget.dataset.to,
      event.currentTarget.dataset.subject,
      event.currentTarget.dataset.timestamp,
      document.querySelector('#email-body').innerHTML
    );
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function reply_email(to, subject, prev_timestamp, body) {
  document.querySelector('#compose-recipients').value = to;
  // Check if it already starts with "Re:"
  if (!subject.startsWith('Re: ')) {
    document.querySelector('#compose-subject').value = `Re: ${subject}`;
  } else {
    document.querySelector('#compose-subject').value = subject;
  }
  const from = document.getElementById('accountHeading').textContent;
  const bodyElement = document.querySelector('#compose-body');
  bodyElement.value = `\n\nOn ${prev_timestamp} ${from} wrote:\n${body}`;
  // Focus on body text input
  bodyElement.focus();
  //Scroll at the top of body text input
  bodyElement.scrollTop = 0;
  // Set cursor at beginning;
  bodyElement.setSelectionRange(0, 0);


}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
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
  email.setAttribute('id', contents.id);
  email.className = 'email d-flex flex-row border border-secondary rounded';
  if (!contents.read) {
    email.classList.add('bg-white'); // email not read
  } else {
    email.classList.add('bg-light'); // email read
  }
  email.style.padding = '5px';
  email.style.marginBottom = '1px';
  email.style.cursor = 'pointer';
    // add click event handler to view
  email.addEventListener('click', (e) => {
    view_email(e);
  });
  // address container
  const address = document.createElement('div');
  address.className = 'address';
  if (contents.sender === document.getElementById('accountHeading').textContent) {
    address.innerHTML = contents.recipients; // email sent from current account
  } else {
    address.innerHTML = contents.sender;
  }
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
  subject.style.whiteSpace='nowrap';
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

function markRead(id) {
  fetch(`/emails/${id}`, {
  method: 'PUT',
  body: JSON.stringify({
      read: true
    })
  })
  .then(() => {
    const div = document.getElementById(id);
    div.classList.remove('bg-white');
    div.classList.add('bg-light');
  });
}

function view_email(event) {
  const id = event.currentTarget.id;
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    markRead(id)

    document.querySelector('#email-from').innerHTML = `<strong> From: </strong>${email.sender}`;
    document.querySelector('#replyButton').setAttribute('data-to', email.sender);
    document.querySelector('#email-to').innerHTML = `<strong> To: </strong>${email.recipients}`;
    document.querySelector('#email-subject').innerHTML = `<strong> Subject: </strong>${email.subject}`;
    document.querySelector('#replyButton').setAttribute('data-subject', email.subject);
    document.querySelector('#email-timestamp').innerHTML = `<strong> Timestamp: </strong>${email.timestamp}`;
    document.querySelector('#replyButton').setAttribute('data-timestamp', email.timestamp);
    document.querySelector('#email-body').innerHTML = email.body;
    document.querySelector('#email-id').setAttribute('data-id', email.id);
    document.querySelector('#email-archived').setAttribute('data-archived', email.archived);
    document.querySelector('#email-read').setAttribute('data-read', email.read);

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Change archiver button if email is Archived or Unarchived
    if (email.archived) {
      document.querySelector('#archiverButton').innerHTML = 'Unarchive';
    } else {
      document.querySelector('#archiverButton').innerHTML = 'Archive';
    }

    // Cannot archive sent emails
    if (email.sender === document.getElementById('accountHeading').textContent) {
      document.querySelector('#archiverButton').style.display = 'none';
    } else {
      document.querySelector('#archiverButton').style.display = 'block';
    }

  });
}

function archiver(id, action) {
  let archive = true;
  if (action === 'unarchive') {archive = false;}
  fetch(`/emails/${id}`, {
  method: 'PUT',
  body: JSON.stringify({
      archived: archive
    })
  })
  .then(() => {
    load_mailbox('inbox');
  });
}
