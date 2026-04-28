const testMessage = async (message) => {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context: 'responder' }),
  });

  const data = await response.json();
  console.log(`Question: ${message}`);
  console.log(`Response: ${data.message?.substring(0, 100)}...`);
  return data;
};

testMessage("What should I do if someone has a severe allergic reaction?").catch(console.error);
