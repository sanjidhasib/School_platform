db.users.updateMany(
  { email: /@shapla\.edu\.bd$/ },
  [
    {
      $set: {
        email: {
          $replaceAll: { input: '$email', find: '@shapla.edu.bd', replacement: '@barishal-zillaschool.edu.bd' },
        },
      },
    },
  ]
);
print('Updated users:', db.users.countDocuments({ email: /shapla/ }));
print('Updated users (new domain):', db.users.countDocuments({ email: /barishal-zillaschool/ }));
print(JSON.stringify(db.users.find({}, { username: 1, email: 1, role: 1 }).limit(10).toArray()));
