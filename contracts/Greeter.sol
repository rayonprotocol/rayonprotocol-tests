contract Greeter{
    /* Define variable greeting of the type string */
    string  public greeting;

    constructor() public {
        greeting = "Hello World!";
    }

    /* Main function */
    function setGreeting(string _greeting) public {
        greeting = _greeting;
    }
}