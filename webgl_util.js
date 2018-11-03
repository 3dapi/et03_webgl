function Vec3Normalize(v)
{
	var r;

	r = Math.sqrt( v[0]*v[0] + v[1]*v[1] + v[2]*v[2] );
	if (r == 0.0)
		return v;

	r = 1.0/r;
	v[0] *= r; v[1] *= r; v[2] *= r;
	return v;
}


function Vec3Cross(Out, v1, v2)
{
	Out[0] = v1[1] * v2[2] - v1[2] * v2[1];
	Out[1] = v1[2] * v2[0] - v1[0] * v2[2];
	Out[2] = v1[0] * v2[1] - v1[1] * v2[0];

	return Out;
}

function Vec3Dot(v1, v2)
{
	return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
}


function GluPerspective(Fov, Aspect, Near, Far)
{
	var Out = new Array(16);

	var COT  = Math.tan(Fov/2. * 3.14159265358979/180.0 );

	COT = 1.0/COT;

	Out[ 0]=  COT/Aspect;	Out[ 1]= 0.0     ;	Out[ 2]= 0.0                   ;    Out[ 3]= 0.0;
	Out[ 4]= 0.0        ;	Out[ 5]=  COT    ;	Out[ 6]= 0.0                   ;	Out[ 7]= 0.0;
	Out[ 8]= 0.0        ;	Out[ 9]= 0.0     ;	Out[10]= -(Far+Near)/(Far-Near);	Out[11]= -1.0;
	Out[12]= 0.0        ;	Out[13]= 0.0     ;	Out[14]= -2*Far*Near/(Far-Near);	Out[15]= 0.0;

	return Out;
}


function GluOrtho(Left, Right, Bottom, Top, Near, Far)
{
	var Out = new Array(16);

	Out[ 0] = 2.0/(Right-Left)         ; Out[ 1] = 0.0                      ; Out[ 2] = 0.0                  ; Out[ 3] = 0.0;
	Out[ 4] = 0.0                      ; Out[ 5] = 2.0/(Top-Bottom)         ; Out[ 6] = 0.0                  ; Out[ 7] = 0.0;
	Out[ 8] = 0.0                      ; Out[ 9] = 0.0                      ; Out[10] = 2.0/(Near-Far)       ; Out[11] = 0.0;
	Out[12] = (Left+Right)/(Left-Right); Out[13] = (Bottom+Top)/(Bottom-Top); Out[14] = (Near+Far)/(Near-Far); Out[15] = 1.0;

	return Out;
}


function GluLookAt(EyeX, EyeY, EyeZ, AtX, AtY, AtZ, UpX, UpY, UpZ)
{
	var Out = new Array(16);

	var Eye =[EyeX, EyeY, EyeZ];
	var AxisX=[0,0,0];
	var AxisY=[UpX, UpY, UpZ]
	var AxisZ=[0,0,0];

	AxisZ[0] = EyeX - AtX;			// Z = Eye - LookAt
	AxisZ[1] = EyeY - AtY;
	AxisZ[2] = EyeZ - AtZ;

	AxisZ = Vec3Normalize(AxisZ);
	AxisX = Vec3Cross(AxisX, AxisY, AxisZ);	// X = Y ^ Z
	AxisX = Vec3Normalize(AxisX);

	AxisY = Vec3Cross(AxisY, AxisZ, AxisX);	// Y = Z ^ X

	Out[ 0]= AxisX[0];	Out[ 1]= AxisY[0];	Out[ 2]= AxisZ[0];	Out[ 3]= 0.0;
	Out[ 4]= AxisX[1];	Out[ 5]= AxisY[1];	Out[ 6]= AxisZ[1];	Out[ 7]= 0.0;
	Out[ 8]= AxisX[2];	Out[ 9]= AxisY[2];	Out[10]= AxisZ[2];	Out[11]= 0.0;

	Out[12]= -Vec3Dot(Eye, AxisX);
	Out[13]= -Vec3Dot(Eye, AxisY);
	Out[14]= -Vec3Dot(Eye, AxisZ);
	Out[15]= 1.0;

	return Out;
}


///////////////////////////////////////////////////////////////////////////////


function CreateNativeWindow(id, w, h)
{
	var gl = null;

	document.body.style.border  = 'none';
	document.body.style.margin  = '0';
	document.body.style.padding = '0';

	var native_win = document.createElement(id);
	native_win.width  = w;
	native_win.height = h;
	document.body.appendChild(native_win);

	return native_win;
}

function CreateContext(native_win)
{
	var gl = null;

	try
	{
		gl = native_win.getContext("experimental-webgl");
		gl.viewportWidth  = native_win.width;
		gl.viewportHeight = native_win.height;
	}
	catch (e){}

	return gl;
}


function FindShader(gl, id)								// find the shader script
{
	var shaderScript = document.getElementById(id);
	if (!shaderScript)
	{
		return null;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while (k)
	{
		if (k.nodeType == 3)							// text node type
		{
			str += k.textContent;
		}
		k = k.nextSibling;
	}

	var shader;
	if (shaderScript.type == "x-shader/x-fragment")
	{
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	}
	else if (shaderScript.type == "x-shader/x-vertex")
	{
		shader = gl.createShader(gl.VERTEX_SHADER);
	}
	else
	{
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}


function CreateProgram(gl, vs, fs)
{
	var shader_vtx = FindShader(gl, "shader-vs");
	var shader_frg = FindShader(gl, "shader-fs");

	var program = gl.createProgram();
	gl.attachShader(program, shader_vtx);
	gl.attachShader(program, shader_frg);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
	{
		alert("Could not initialise shaders");
		return null;
	}

	return program;
}

function UsePrgram(gl, program)
{
	gl.useProgram(program);
}


function CreateVbo(gl, buf)
{
	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buf), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	return vbo;
}


function UpdateVbo(gl, vbo, buf)
{
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buf), gl.DYNAMIC_DRAW);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
}


function CreateIbo(gl, buf)
{
	var ibo  = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo );
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(buf), gl.STATIC_DRAW);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

	return ibo;
}

function BindIbo(gl, ibo)
{
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo );
}


function AttributeStream(gl, idx, vbo, count)
{
	if(null == vbo || 0 == count)
	{
		gl.disableVertexAttribArray(idx);
		return;
	}

	gl.enableVertexAttribArray(idx);
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.vertexAttribPointer(idx, count, gl.FLOAT, false, 0, 0);
}


function DrawElement(gl, ptype, count)
{
	gl.drawElements(ptype, count, gl.UNSIGNED_SHORT, 0);
}


function DrawArray(gl, ptype, begin, count)
{
	gl.drawArrays(ptype, begin, count);
}


function CreateTexture(file)
{
	var texture = gl.createTexture();
	texture.image = new Image();
	texture.image.crossOrigin = "anonymous";
	texture.image.src = file;
	texture.image.onload = function() { TextureOnLoad(texture); }
	return texture;
}


function TextureOnLoad(texture)
{
	console.log("TextureOnLoad, image = " + texture.image);

	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);

	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}


function ActiveTexture(gl, program, texture, idx, name)
{
	gl.activeTexture(gl.TEXTURE0 + idx);
	gl.bindTexture(gl.TEXTURE_2D, texture);

	if(null == texture)
		return;

	gl.uniform1i(gl.getUniformLocation(program, name), idx);
}


///////////////////////////////////////////////////////////////////////////////


function UniformMatrix(gl, program, Name, m)
{
	var idx = gl.getUniformLocation(program, Name);
	if(null == idx)
		return;

	gl.uniformMatrix4fv(idx, false, m);
}


function UniformVec4(gl, program, Name, v)
{
	var idx = gl.getUniformLocation(program, Name);
	if(null == idx)
		return;

	gl.uniform4fv(idx, v);
}

function UniformVec3(gl, program, Name, v)
{
	var idx = gl.getUniformLocation(program, Name);
	if(null == idx)
		return;

	gl.uniform3fv(idx, v);
}

function UniformVec2(gl, program, Name, v)
{
	var idx = gl.getUniformLocation(program, Name);
	if(null == idx)
		return;

	gl.uniform2fv(idx, v);
}


function UniformFloat(gl, program, Name, v)
{
	var idx = gl.getUniformLocation(program, Name);
	if(null == idx)
		return;

	gl.uniform1f(idx, v);
}

function UniformInt(gl, program, Name, v)
{
	var idx = gl.getUniformLocation(program, Name);
	if(null == idx)
		return;

	gl.uniform1i(idx, v);
}