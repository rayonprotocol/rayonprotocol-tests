contract KeyValue{
    mapping(uint32 => uint32) public map;

    function put(uint32 _key, uint32 _value) public {
        require(_key != 0, "key cannot be 0");
        require(_value != 0, "value cannot be 0");
        require(map[_key] == 0, "key must not contain in map");

        map[_key] = _value;
    }

    function get(uint32 _key) public view returns (uint32) {
        require(_key != 0, "key cannot be 0");
        require(map[_key] != 0, "key must contain in map");

        return map[_key];
    }
}