//density

vec4 getRho(sampler2D ch, vec2 pos) {

  position tpos = getPos(pos, 0, 0, 0);
  vec4 data = texel(ch, tpos.tpos);
  vec4 data2 = texel(ch, tpos.tposZ);
  particle P = getParticle(data, data2, tpos.addpos);

  //particle render
  vec4 rho = vec4(0.);
  range(i, -1, 1) range(j, -1, 1) //range(k, 0, 16)
  {
      int k = 0;
      //position tpos = getPos(tpos.addpos.xy, i, j, k);
      position tpos = getPos(pos, i, j, k);
      vec4 data = texel(ch, tpos.tpos);
      vec4 data2 = texel(ch, tpos.tposZ);
      particle P0 = getParticle(data, data2, tpos.addpos);

      vec3 x0 = P0.X; //update position
      //how much mass falls into this pixel
      //rho += 1.*vec4(P.V, P.M)*G((pos - x0)/0.75);
      
      //rho.xy += 1.*vec2(P.V.xy)*G((tpos.addpos - x0)/0.75);
      //rho.zw += 1.*vec2(P.M)*G((tpos.addpos - x0)/0.75);
      rho.xy += 1.*vec2(P.V.xy)*G((tpos.addpos - x0)/0.75);
      rho.zw += 1.*vec2(P.M)*G((tpos.addpos - x0)/0.75);
  }

  return rho;
}

void mainImage( out vec4 fragColor, in vec2 pos )
{
    R = iResolutionOne.xy; time = iTime;

    //fragColor = getRho(ch0, floor(pos) * vec2(float(zextra), 1.0));
    vec2 rpos = pos;
    //rpos.x = fract(rpos.x) + floor(pos.x) * float(zextra);
    rpos.x = fract(pos.x) + floor(pos.x) * zextra;
    fragColor = getRho(ch0, rpos);
}
