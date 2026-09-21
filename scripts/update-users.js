db.users.updateOne(
  { username: 'admin' },
  { $set: { email: 'admin@barishal-zillaschool.edu.bd' } }
);
print(JSON.stringify(db.users.findOne({ username: 'admin' }, { username: 1, email: 1, role: 1 })));
