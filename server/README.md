# WWV Server

## Event object format

```javascript
{
	event: 'string'
	data: {
		// arbitrary data
	}
}
```

## Currently supported events

**Note :** The format of the event data documented bellow assumes
the above defined wrapper, with the key set as specified.

### Recievable

#### SET_ALIAS

Key : `Set Alias`

```javascript
{
	alias: 'string'
}
```

#### JOIN_ROOM

Key : `Join Room`

```javascript
{
	name: 'string'
}
```

#### CREATE_ROOMS

Key : `Create Room`

```javascript
{
	name: 'string'
}
```

### Transmittable