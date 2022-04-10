```
Person = (
  int age;
  string name;
);

growOlder :: Person -> void {
  age += 1;
};

sum :: |a: int, b: int| -> int {
  -> a + b;
};

sum :: (a int, b int) -> int {
  -> a + b;
};

sum :: (int a, int b) -> int {
  -> a + b;
};

sum :: (int a, int b) -> int {
  >> a + b;
};

|int a, int b| -> void
sum :: {
  >> a + b;
};

zero :: {
  >> 0;
};


sum :: functional_interface block
// 



person : growOlder();


// person = growOlder(person)
```
