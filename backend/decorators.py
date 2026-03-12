from flask import jsonify, request, make_response
import jwt
from functools import wraps

import globals

# Access the blacklist collection for logged-out tokens
blacklist = globals.db.blacklist

def jwt_required(func):
    @wraps(func)
    def jwt_required_wrapper(*args, **kwargs):
        token = None
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        
        if not token:
            return make_response(jsonify({'message': 'Token is missing'}), 401)
        
        try:
            data = jwt.decode(token, globals.SECRET_KEY, algorithms='HS256')
        except:
            return make_response(jsonify({'message': 'Token is invalid'}), 401)
        
        # Check if the token was invalidated (logged out)
        bl_token = blacklist.find_one({'token': token})
        if bl_token is not None:
            return make_response(jsonify({'message': 'Token has been cancelled'}), 401)
        
        return func(*args, **kwargs)
    return jwt_required_wrapper

def admin_required(func):
    @wraps(func)
    def admin_required_wrapper(*args, **kwargs):
        token = request.headers['x-access-token']
        # Decode the token to check the 'admin'
        data = jwt.decode(token, globals.SECRET_KEY, algorithms='HS256')
        
        if data['admin']:
            return func(*args, **kwargs)
        else:
            return make_response(jsonify({'message': 'Admin required'}), 403)
            
    return admin_required_wrapper