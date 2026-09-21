db.achievements.updateMany(
  { title: /Football Tournament/ },
  [
    {
      $set: {
        title: {
          $replaceAll: { input: '$title', find: 'Dhaka District', replacement: 'Barishal District' },
        },
        description: {
          $replaceAll: { input: '$description', find: 'Dhaka District', replacement: 'Barishal District' },
        },
      },
    },
  ]
);
db.achievements.updateMany(
  { title: /Best School Award/ },
  [
    {
      $set: {
        title: {
          $replaceAll: { input: '$title', find: 'Dhaka District', replacement: 'Barishal District' },
        },
        description: {
          $replaceAll: { input: '$description', find: 'Dhaka District', replacement: 'Barishal District' },
        },
      },
    },
  ]
);
print(JSON.stringify(db.achievements.find({}, { title: 1, description: 1 }).toArray()));
