db.achievements.updateMany(
  { description: /Shapla Model School/ },
  [
    {
      $set: {
        description: {
          $replaceAll: {
            input: '$description',
            find: 'Shapla Model School',
            replacement: 'Barishal Zilla School',
          },
        },
      },
    },
  ]
);
print(JSON.stringify(db.achievements.find({}, { title: 1, description: 1 }).toArray()));
